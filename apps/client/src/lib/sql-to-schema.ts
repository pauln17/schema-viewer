import { Parser } from "node-sql-parser";
import { Schema } from "@/types/schema";

// SQL -> Dialect Specific ASTs -> Schema
const sqlToSchema = (sql: string): Schema => {
    const parser = new Parser();
    const ast = parser.astify(sql);
    console.log(ast);

    return {
        name: "Example Schema",
        definition: {
            tables: [],
            enums: [],
        },
    };
};

const sqlExample = `
  CREATE TYPE user_role AS ENUM ('admin', 'user');

  CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role DEFAULT 'user',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    birth_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT now()
  );

  CREATE INDEX idx_users_email ON users (email);
`;

export { sqlToSchema, sqlExample }