import mongoose from 'mongoose';

const userDataSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    birthday: {
        type: Date,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    discount: {
        type: Number,
        default: 0 // Discount value, e.g., percentage or a flat rate
    },
    paymentMethod: {
        type: String,
        required: true // Could be 'Credit Card', 'PayPal', etc.
    },
    contactNumber: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

const UserData = mongoose.model('UserData', userDataSchema);

export default UserData;
