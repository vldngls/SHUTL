import mongoose from 'mongoose';

const maintenanceSettingsSchema = new mongoose.Schema({
  isEnabled: {
    type: Boolean,
    required: true,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  message: {
    type: String,
    default: "Site is under maintenance. You can continue to use the shuttle service traditionally."
  }
}, {
  timestamps: true
});

// Ensure there's only one maintenance settings document
maintenanceSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    // Create default settings if none exist
    settings = await this.create({
      isEnabled: false,
      message: "Site is under maintenance. You can continue to use the shuttle service traditionally."
    });
  }
  return settings;
};

const MaintenanceSettings = mongoose.model('MaintenanceSettings', maintenanceSettingsSchema);

export default MaintenanceSettings; 