const fs = require("fs");
const path = require("path");

function ensurePrismaStub() {
  try {
    const packageJsonPath = require.resolve("@prisma/client/package.json");
    const clientRoot = path.dirname(packageJsonPath);
    const stubDir = path.join(clientRoot, ".prisma", "client");
    const altStubDir = path.join(process.cwd(), "node_modules", ".prisma", "client");
    const stubPath = path.join(stubDir, "default.js");
    const altStubPath = path.join(altStubDir, "default.js");

    if (fs.existsSync(stubPath) && fs.existsSync(altStubPath)) {
      return;
    }

    fs.mkdirSync(stubDir, { recursive: true });
    fs.mkdirSync(altStubDir, { recursive: true });

    const stubContent = `const noop = () => {
  throw new Error("Prisma client is not generated in this environment.");
};

class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        if (typeof prop === "string" && !(prop in target)) {
          target[prop] = new Proxy(noop, {
            get(innerTarget, innerProp) {
              if (innerProp === "then") return undefined;
              if (!(innerProp in innerTarget)) {
                innerTarget[innerProp] = noop;
              }
              return innerTarget[innerProp];
            },
            apply(fn, thisArg, args) {
              return fn.apply(thisArg, args);
            },
          });
        }
        return target[prop];
      },
    });
  }

  $connect = noop;
  $disconnect = noop;
  $transaction = () => {
    throw new Error("Transactions are not available without a generated Prisma client.");
  };
}

const Prisma = {
  CategoryVisibility: { public: "public", private: "private", restricted: "restricted" },
  FileSetVisibility: { public: "public", private: "private", restricted: "restricted" },
  UserRole: { admin: "admin", user: "user" },
  UserStatus: { active: "active", suspended: "suspended" },
};

module.exports = {
  Prisma,
  PrismaClient,
  dmmf: {},
};
`;

    fs.writeFileSync(stubPath, stubContent, "utf8");
    fs.writeFileSync(altStubPath, stubContent, "utf8");
    // eslint-disable-next-line no-console
    console.warn("Created Prisma client stub at", stubPath, "and", altStubPath);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to create Prisma client stub", error);
  }
}

ensurePrismaStub();
