import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES, type Role } from "../config/auth.js";

// Staff account (doctor / nurse / intake / admin). Patients do NOT have accounts;
// they are authorised per-case via short-lived case tokens (see config/auth.ts).
export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: Role;
  displayName: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  verifyPassword(plain: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 64,
    },
    // Never store plaintext passwords. `passwordHash` holds a bcrypt hash and is
    // excluded from query results by default (select: false).
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ROLES,
      required: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

UserSchema.methods.verifyPassword = function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash);
};

export async function hashPassword(plain: string): Promise<string> {
  const rounds = Number(process.env.BCRYPT_ROUNDS) || 12;
  return bcrypt.hash(plain, rounds);
}

export const User = mongoose.model<IUser>("User", UserSchema);
