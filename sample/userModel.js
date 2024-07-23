import mongoose from 'mongoose';
const userSchema = mongoose.Schema({
    employeeId: { type: String, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    gender: { type: String, required: true },
    hasVoted: { type: Boolean, required: true },
    gotVotes: { type: Array, required: true },
}, {timestamps: true });
const User = mongoose.model('users', userSchema);
export default User;