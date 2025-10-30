/**
 * A Result type inspired by Rust's std::result::Result.
 * Represents either a success (Ok) or a failure (Err).
 */
export abstract class Result<T, E> {
  /**
   * Return true if the result is Ok.
   */
  isOk(): this is Ok<T, E> {
    return this instanceof Ok;
  }

  /**
   * Return true if the result is Err.
   */
  isErr(): this is Err<T, E> {
    return this instanceof Err;
  }

  /**
   * Apply a function to the value inside Ok.
   *
   * @param f - A function to apply to the Ok value.
   * @returns Ok(f(value)) if Ok, else self as Err.
   */
  map<U>(f: (value: T) => U): Result<U, E> {
    if (this.isOk()) {
      return ok(f(this.value));
    }
    return this as unknown as Result<U, E>;
  }

  /**
   * Apply a function to the error inside Err.
   *
   * @param f - A function to apply to the Err value.
   * @returns Err(f(error)) if Err, else self as Ok.
   */
  mapErr<F>(f: (error: E) => F): Result<T, F> {
    if (this.isErr()) {
      return err(f(this.error));
    }
    return this as unknown as Result<T, F>;
  }

  /**
   * Chain another operation that returns a Result.
   *
   * @param f - A function that returns Result.
   * @returns The result of f if Ok, else self as Err.
   */
  andThen<U>(f: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isOk()) {
      return f(this.value);
    }
    return this as unknown as Result<U, E>;
  }

  /**
   * Return the Ok value or throws Error if Err.
   *
   * @throws {Error} If result is Err.
   * @returns The value inside Ok.
   */
  unwrap(): T {
    if (this.isOk()) {
      return this.value;
    }
    throw new Error(`Called unwrap on Err: ${JSON.stringify(this.error)}`);
  }

  /**
   * Return the Ok value or undefined if Err.
   *
   * @returns The value inside Ok or undefined.
   */
  ok(): T | undefined {
    if (this.isOk()) {
      return this.value;
    }
    return undefined;
  }

  /**
   * Return the Err value or undefined if Ok.
   *
   * @returns The error inside Err or undefined.
   */
  err(): E | undefined {
    if (this.isErr()) {
      return this.error;
    }
    return undefined;
  }

  /**
   * Return the Ok value or a default if Err.
   *
   * @param defaultValue - The fallback value.
   * @returns The value inside Ok or the default.
   */
  unwrapOr(defaultValue: T): T {
    if (this.isOk()) {
      return this.value;
    }
    return defaultValue;
  }

  /**
   * Internal getter for value. Only accessible after type guard.
   */
  abstract get value(): T;

  /**
   * Internal getter for error. Only accessible after type guard.
   */
  abstract get error(): E;
}

/**
 * Represents a successful result containing a value.
 */
export class Ok<T, E = never> extends Result<T, E> {
  readonly #value: T;

  constructor(value: T) {
    super();
    this.#value = value;
  }

  get value(): T {
    return this.#value;
  }

  get error(): E {
    throw new Error("Called error getter on Ok");
  }

  toString(): string {
    return `Ok(${JSON.stringify(this.#value)})`;
  }
}

/**
 * Represents a failed result containing an error.
 */
export class Err<T, E> extends Result<T, E> {
  readonly #error: E;

  constructor(error: E) {
    super();
    this.#error = error;
  }

  get value(): T {
    throw new Error("Called value getter on Err");
  }

  get error(): E {
    return this.#error;
  }

  toString(): string {
    return `Err(${JSON.stringify(this.#error)})`;
  }
}

/**
 * Helper function to create an Ok result.
 * When assigned to a Result<T, E> type, the error type E is automatically inferred.
 */
export function ok<T, E = never>(value: T): Result<T, E> {
  return new Ok(value);
}

/**
 * Helper function to create an Err result.
 * When assigned to a Result<T, E> type, the value type T is automatically inferred.
 */
export function err<E, T = never>(error: E): Result<T, E> {
  return new Err(error);
}
