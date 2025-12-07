declare module "@prisma/client" {
  export type CategoryVisibility = "private" | "internal" | "public";
  export type FileSetVisibility = "private" | "internal" | "public";
  export type UserRole = "admin" | "member";
  export type UserStatus = "pending" | "active" | "rejected";
  export type MediaType = "image" | "video";

  export namespace Prisma {
    export type CategoryWhereInput = Record<string, unknown>;
    export type PhotoWhereInput = Record<string, unknown>;
    export type UserWhereInput = Record<string, unknown>;
  }

  export class PrismaClient {
    [key: string]: any;
    constructor(...args: any[]);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
  }
}
