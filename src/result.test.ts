import { describe, test, expect } from "@jest/globals";
import { ok, err, Result } from "./result";

describe("Result", () => {
  describe("Ok", () => {
    test("isOk returns true", () => {
      const result = ok(42);
      expect(result.isOk()).toBe(true);
      expect(result.isErr()).toBe(false);
    });

    test("map transforms the value", () => {
      const result = ok(5).map((x) => x * 2);
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.unwrap()).toBe(10);
      }
    });

    test("mapErr does nothing", () => {
      const okResult: Result<number, string> = ok(5);
      const result = okResult.mapErr((e) => e.toUpperCase());
      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toBe(5);
    });

    test("andThen chains operations", () => {
      const result = ok(5).andThen((x) => ok(x * 2));
      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toBe(10);
    });

    test("unwrap returns the value", () => {
      const result = ok(42);
      expect(result.unwrap()).toBe(42);
    });

    test("ok returns the value", () => {
      const result = ok(42);
      expect(result.ok()).toBe(42);
    });

    test("err returns undefined", () => {
      const result = ok(42);
      expect(result.err()).toBeUndefined();
    });

    test("unwrapOr returns the value", () => {
      const result = ok(42);
      expect(result.unwrapOr(0)).toBe(42);
    });

    test("toString formats correctly", () => {
      const result = ok(42);
      expect(result.toString()).toBe("Ok(42)");
    });

    test("access value after isOk", () => {
      const result = ok(42);
      if (result.isOk()) {
        expect(result.value).toBe(42);
      }
    });
  });

  describe("Err", () => {
    test("isErr returns true", () => {
      const result = err("error");
      expect(result.isErr()).toBe(true);
      expect(result.isOk()).toBe(false);
    });

    test("map does nothing", () => {
      const result = err("error").map((x) => x * 2);
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.err()).toBe("error");
      }
    });

    test("mapErr transforms the error", () => {
      const result = err("error").mapErr((e) => e.toUpperCase());
      expect(result.isErr()).toBe(true);
      expect(result.err()).toBe("ERROR");
    });

    test("andThen does nothing", () => {
      const result = err("error").andThen((x) => ok(x * 2));
      expect(result.isErr()).toBe(true);
      expect(result.err()).toBe("error");
    });

    test("unwrap throws error", () => {
      const result = err("error");
      expect(() => result.unwrap()).toThrow("Called unwrap on Err");
    });

    test("ok returns undefined", () => {
      const result = err("error");
      expect(result.ok()).toBeUndefined();
    });

    test("err returns the error", () => {
      const result = err("error");
      expect(result.err()).toBe("error");
    });

    test("unwrapOr returns the default", () => {
      const result: Result<number, string> = err("error");
      expect(result.unwrapOr(0)).toBe(0);
    });

    test("toString formats correctly", () => {
      const result = err("error");
      expect(result.toString()).toBe('Err("error")');
    });

    test("access error after isErr", () => {
      const result = err("error");
      if (result.isErr()) {
        expect(result.error).toBe("error");
      }
    });
  });

  describe("Type narrowing", () => {
    test("type narrows correctly after isOk", () => {
      const result = ok(42);
      if (result.isOk()) {
        // TypeScript knows this is Ok<number, string>
        const value: number = result.value;
        expect(value).toBe(42);
      }
    });

    test("type narrows correctly after isErr", () => {
      const result = err("error");
      if (result.isErr()) {
        const error: string = result.error;
        expect(error).toBe("error");
      }
    });
  });

  describe("Chaining operations", () => {
    test("chains multiple operations", () => {
      const result = ok(5)
        .map((x) => x * 2)
        .map((x) => x + 1)
        .andThen((x) => ok(x.toString()));

      expect(result.unwrap()).toBe("11");
    });

    test("short-circuits on error", () => {
      const result = err("error")
        .map((x) => x * 2)
        .map((x) => x + 1);

      expect(result.err()).toBe("error");
    });
  });

  describe("Switch on Ok/Err", () => {
    test("switches on Ok", () => {
      const result: Result<number, string> = ok(42);
      result.switch({
        Ok: (x) => expect(x).toBe(42),
        Err: (e) => expect(e).toBeUndefined(),
      });
    });

    test("switches on Err", () => {
      const result = err("error");
      result.switch({
        Ok: (x) => expect(x).toBeUndefined(),
        Err: (e) => expect(e).toBe("error"),
      });
    });

    test("switches on Ok and Err and return the different values of the same type", () => {
      const result: Result<number, string> = ok(42);
      const value = result.switch({
        Ok: (x) => x + 1,
        Err: (_e) => 2,
      });
      expect(value).toBe(43);
    });

    test("type narrows correctly after isOk", () => {
      const result: Result<number, string> = ok(42);

      if (result.isOk()) {
        // TypeScript knows result is Ok<number, string>
        const value = result.value; // No type error
        expect(value).toBe(42);
      }

      let hitsErrorBlock = false;
      if (result.isErr()) {
        hitsErrorBlock = true;
      }
      expect(hitsErrorBlock).toBeFalsy();
    });

    test("type narrows correctly after isErr", () => {
      const result: Result<number, string> = err("error");

      let hitsValueBlock = false;
      if (result.isOk()) {
        hitsValueBlock = true;
      }
      expect(hitsValueBlock).toBeFalsy();

      if (result.isErr()) {
        // TypeScript knows result is Err<number, string>
        const error = result.error; // No type error
        expect(error).toBe("error");
      }
    });
  });
});
