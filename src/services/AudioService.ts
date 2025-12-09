import axios from "axios";
import { AudioService, ApiError } from "../types";
import { config } from "../config/environment";

export class AudioServiceImpl implements AudioService {
  private readonly maxFileSize: number;
  private readonly supportedFormats: string[];
  private readonly retryAttempts: number = 3;
  private readonly retryDelay: number = 1000;

  constructor() {
    this.maxFileSize = this.parseFileSize(config.maxFileSize);
    this.supportedFormats = config.supportedFormats;
  }

  public validateAudioUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Only allow https protocols
      if (!(urlObj.protocol === "http:" || urlObj.protocol === "https:")) {
        return false;
      }
      const pathname = urlObj.pathname.toLowerCase();

      const hasValidExtension = this.supportedFormats.some((format) => pathname.endsWith(`.${format}`));

      return hasValidExtension;
    } catch {
      return false;
    }
  }

  // downloads audio file
  public async downloadAudio(url: string): Promise<Buffer> {
    if (!this.validateAudioUrl(url)) {
      throw this.createError(`Unsupported audio format. Supported formats: ${this.supportedFormats.join(", ")}`, 400, "UNSUPPORTED_FORMAT");
    }

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        console.log(`Downloading audio from ${url} (attempt ${attempt}/${this.retryAttempts})`);

        const response = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 30000, // 30 seconds timeout
          headers: {
            "User-Agent": "VoiceOwl-Audio-Service/1.0",
          },
        });

        const buffer = Buffer.from(response.data as ArrayBuffer);

        if (buffer.length === 0) {
          throw this.createError("Downloaded file is empty", 400, "EMPTY_FILE");
        }

        if (buffer.length > this.maxFileSize) {
          throw this.createError(`File size (${buffer.length} bytes) exceeds maximum allowed size (${this.maxFileSize} bytes)`, 413, "FILE_TOO_LARGE");
        }

        console.log(`Successfully downloaded audio file (${buffer.length} bytes)`);
        return buffer;
      } catch (error) {
        const isLastAttempt = attempt === this.retryAttempts;

        if (error && typeof error === "object" && "isAxiosError" in error) {
          if (error.response?.status === 404) {
            throw this.createError("Audio file not found at the provided URL", 404, "FILE_NOT_FOUND");
          }

          if (error.response?.status === 403) {
            throw this.createError("Access denied to the audio file", 403, "ACCESS_DENIED");
          }

          if (error.code === "ENOTFOUND") {
            throw this.createError("Invalid URL or network error", 400, "INVALID_URL");
          }

          if (error.code === "ECONNABORTED") {
            if (isLastAttempt) {
              throw this.createError("Download timeout - file too large or server too slow", 408, "TIMEOUT");
            }
          }
        }

        if (error instanceof Error && "statusCode" in error) {
          throw error; // Re-throw our custom errors
        }

        if (!isLastAttempt) {
          console.log(`Download attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
          await this.delay(this.retryDelay * attempt);
          continue;
        }

        // Final attempt failed
        throw this.createError(`Failed to download audio file after ${this.retryAttempts} attempts: ${error instanceof Error ? error.message : "Unknown error"}`, 500, "DOWNLOAD_FAILED");
      }
    }

    throw this.createError("Unexpected error in download process", 500, "UNKNOWN_ERROR");
  }

  //  Mock implementation

  public async mockDownloadAudio(url: string): Promise<Buffer> {
    console.log(`Mock downloading audio from ${url}`);

    await this.delay(Math.random() * 1000 + 500);

    if (!this.validateAudioUrl(url)) {
      throw this.createError(`Unsupported audio format. Supported formats: ${this.supportedFormats.join(", ")}`, 400, "UNSUPPORTED_FORMAT");
    }

    const mockAudioData = Buffer.from("mock-audio-binary-data");
    console.log(`Mock download completed (${mockAudioData.length} bytes)`);

    return mockAudioData;
  }

  private parseFileSize(sizeStr: string): number {
    const units: { [key: string]: number } = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)?$/i);
    if (!match) {
      throw new Error(`Invalid file size format: ${sizeStr}`);
    }

    const value = parseFloat(match[1]);
    const unit = (match[2] || "B").toUpperCase();

    return Math.floor(value * (units[unit] || 1));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private createError(message: string, statusCode: number, code?: string): ApiError {
    const error = new Error(message) as ApiError;
    error.statusCode = statusCode;
    error.code = code;
    return error;
  }
}
