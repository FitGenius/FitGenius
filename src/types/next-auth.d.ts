import "next-auth";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: UserRole;
      professional?: any;
      client?: any;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    professional?: any;
    client?: any;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    professional?: any;
    client?: any;
  }
}