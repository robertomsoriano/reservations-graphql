import { createError } from "apollo-errors";

export const AuthError = createError("AuthError", {
  message: "Authentication error"
});
