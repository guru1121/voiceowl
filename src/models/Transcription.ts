import mongoose, { Schema, Document } from 'mongoose';
import { TranscriptionDocument } from '../types';

// interfacemongoose Document
interface ITranscription extends Omit<TranscriptionDocument, '_id'>, Document {
  toResponse(): {
    _id: string;
    audioUrl: string;
    transcription: string;
    source: string;
    language: string;
    createdAt: Date;
    updatedAt: Date;
  };
}

// transcription schema
const transcriptionSchema = new Schema<ITranscription>({
  audioUrl: {
    type: String,
    required: true,
    trim: true
  },
  transcription: {
    type: String,
    required: true
  },
  source: {
    type: String,
    enum: ['mock', 'azure'],
    required: true,
    default: 'mock'
  },
  language: {
    type: String,
    match: /^[a-z]{2}-[A-Z]{2}$/,
    default: 'en-US'
  }
}, {
  timestamps: true, 
  collection: 'transcriptions'
});


// Indexing 
transcriptionSchema.index({ createdAt: -1 }); 
transcriptionSchema.index({ audioUrl: 1 }); 
transcriptionSchema.index({ source: 1, createdAt: -1 }); 

// Static methods
transcriptionSchema.statics.findRecentTranscriptions = function(days: number = 30, limit: number = 10, offset: number = 0) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    createdAt: { $gte: cutoffDate }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .skip(offset)
  .lean();
};

// instance methods
transcriptionSchema.methods.toResponse = function() {
  return {
    _id: this._id.toString(),
    audioUrl: this.audioUrl,
    transcription: this.transcription,
    source: this.source,
    language: this.language,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

export const Transcription = mongoose.model<ITranscription>('Transcription', transcriptionSchema);