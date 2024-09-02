import mongoose, { mongo } from "mongoose";

const productSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    userType: {
        type: String,
        required: true
    },
}, {
    timestamps: true //createdAt, updatedAt
});

const User = mongoose.model('shutlUser', userSchema);

export default User;