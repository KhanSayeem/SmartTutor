import request from "supertest";
import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../app.js";

const app = createApp();

async function login(email) {
  const response = await request(app).post("/api/auth/login").send({ email, password: "Password123!" });
  return response.body.token;
}

test("student cannot access admin users endpoint", async () => {
  const token = await login("student@smarttutor.local");
  await request(app).get("/api/admin/users").set("Authorization", `Bearer ${token}`).expect(403);
});

test("admin can access admin users endpoint", async () => {
  const token = await login("admin@smarttutor.local");
  const response = await request(app).get("/api/admin/users").set("Authorization", `Bearer ${token}`).expect(200);
  assert.ok(response.body.total >= 3);
});
