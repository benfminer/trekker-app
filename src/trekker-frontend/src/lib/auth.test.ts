import { afterEach, describe, expect, it } from "vitest"
import {
  clearAdminToken,
  getAdminToken,
  isAdminAuthenticated,
  setAdminToken,
} from "./auth"

const TOKEN_KEY = "trekker_admin_token"

describe("auth utilities", () => {
  afterEach(() => {
    localStorage.clear()
  })

  describe("getAdminToken", () => {
    it("returns null when no token is stored", () => {
      expect(getAdminToken()).toBeNull()
    })

    it("returns the stored token", () => {
      localStorage.setItem(TOKEN_KEY, "test-token-abc")
      expect(getAdminToken()).toBe("test-token-abc")
    })
  })

  describe("setAdminToken", () => {
    it("persists the token to localStorage", () => {
      setAdminToken("raw-bearer-token-xyz")
      expect(localStorage.getItem(TOKEN_KEY)).toBe("raw-bearer-token-xyz")
    })

    it("overwrites an existing token", () => {
      setAdminToken("old-token")
      setAdminToken("new-token")
      expect(localStorage.getItem(TOKEN_KEY)).toBe("new-token")
    })
  })

  describe("clearAdminToken", () => {
    it("removes the token from localStorage", () => {
      localStorage.setItem(TOKEN_KEY, "some-token")
      clearAdminToken()
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    })

    it("is a no-op when no token is present", () => {
      expect(() => clearAdminToken()).not.toThrow()
    })
  })

  describe("isAdminAuthenticated", () => {
    it("returns false when no token is stored", () => {
      expect(isAdminAuthenticated()).toBe(false)
    })

    it("returns true when a token is stored", () => {
      localStorage.setItem(TOKEN_KEY, "any-token")
      expect(isAdminAuthenticated()).toBe(true)
    })

    it("returns false after the token is cleared", () => {
      localStorage.setItem(TOKEN_KEY, "some-token")
      clearAdminToken()
      expect(isAdminAuthenticated()).toBe(false)
    })
  })
})
