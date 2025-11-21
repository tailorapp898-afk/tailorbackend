import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  shop_name: String,
  shop_address: String,
  language: { type: String, default: "en", enum: ["en", "ur"] },
  theme: { type: String, default: "light", enum: ["light", "dark"] },
    // 🆕 Added for offline-sync or local database mapping
  localId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
})



// Compare password method
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password)
}

export default mongoose.model("User", userSchema)
