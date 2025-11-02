import { z } from "zod";


// Zod schema matching TAccount / authSchema

const login_validation = z.object({
    email: z.string({ message: "Email is required" }),
    password: z.string({ message: "Email is required" }),
    deviceToken: z.string({message: 'Device token is required'})
})

const changePassword = z.object({
    oldPassword: z.string({ message: "Old Password is required" }),
    newPassword: z.string({ message: "New Password is required" })
})

const forgotPassword = z.object({ email: z.string({ message: "Email is required" }) })
const resetPassword = z.object({
    token: z.string(),
    newPassword: z.string(),
    email: z.string()
})
const verified_account = z.object({
    token: z.string({ message: "Token is Required!!" })
})

export const auth_validation = {
    login_validation,
    changePassword,
    forgotPassword,
    resetPassword,
    verified_account
}


