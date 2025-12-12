import mongoose, { Schema, Document } from 'mongoose';
import { WorkflowDocument, WorkflowStep } from '../types';

// Interface extending mongoose Document
interface IWorkflow extends Omit<WorkflowDocument, '_id'>, Document {}

// WorkflowStep schema
const workflowStepSchema = new Schema<WorkflowStep>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed'],
    default: 'pending'
  },
  startedAt: { type: Date },
  completedAt: { type: Date },
  error: { type: String }
}, { _id: false });

// Workflow schema
const workflowSchema = new Schema<IWorkflow>({
  transcriptionId: {
    type: String,
    required: true,
    ref: 'Transcription'
  },
  steps: [workflowStepSchema],
  currentStep: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true,
  collection: 'workflows'
});

// Indexes
workflowSchema.index({ transcriptionId: 1 });
workflowSchema.index({ status: 1, createdAt: -1 });

// Static methods
workflowSchema.statics.createWorkflow = function(transcriptionId: string) {
  const defaultSteps: WorkflowStep[] = [
    { id: 'transcription', name: 'Transcription', status: 'completed' },
    { id: 'review', name: 'Review', status: 'pending' },
    { id: 'approval', name: 'Approval', status: 'pending' }
  ];
  
  return this.create({
    transcriptionId,
    steps: defaultSteps,
    currentStep: 1,
    status: 'in-progress'
  });
};

// Instance methods
workflowSchema.methods.advanceStep = function() {
  if (this.currentStep < this.steps.length - 1) {
  
    this.steps[this.currentStep].status = 'completed';
    this.steps[this.currentStep].completedAt = new Date();
    
  
    this.currentStep++;
    this.steps[this.currentStep].status = 'in-progress';
    this.steps[this.currentStep].startedAt = new Date();
    
    
    if (this.currentStep === this.steps.length - 1 && 
        this.steps[this.currentStep].status === 'completed') {
      this.status = 'completed';
    }
  }
  
  return this.save();
};

export const Workflow = mongoose.model<IWorkflow>('Workflow', workflowSchema);