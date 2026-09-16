/**
 * Compile-time guard that `ProblemDetails` still covers the generated contract.
 *
 * `ProblemDetails` is hand-written: the generated spec inlines a separate
 * problem schema into every error response rather than sharing one component,
 * so there is no generated symbol to alias. That leaves the type free to drift
 * the next time `yarn codegen:rest` pulls in a field the API started sending.
 *
 * This file closes that gap. It walks every `application/problem+json` body in
 * `paths`, unions their keys, and fails the build if either side gains a field
 * the other does not have. It emits no runtime code; `yarn typecheck:contract`
 * is what runs it.
 */
import type { paths } from '../rest/__generated__/api'
import type { ProblemDetails } from './error'

/** Every response object declared under a path + method. */
type ResponsesOf<T> = T extends { responses: infer R } ? R[keyof R] : never

/** The `application/problem+json` body of a response, if it declares one. */
type ProblemBodyOf<T> = T extends { content: { 'application/problem+json': infer B } } ? B : never

/** Every problem body the spec documents, as a union. */
type DocumentedProblemBody = {
    [P in keyof paths]: {
        [M in keyof paths[P]]: ProblemBodyOf<ResponsesOf<paths[P][M]>>
    }[keyof paths[P]]
}[keyof paths]

/**
 * Drops index signatures, keeping declared keys.
 *
 * The richer problem schemas generate as `{ ...fields } & { [key: string]:
 * unknown }` because RFC 9457 permits extension members. That collapses `keyof`
 * to `string | number` and loses the declared field names; remapping the keys
 * recovers them.
 */
type DeclaredKeysOf<T> = {
    [K in keyof T as string extends K ? never : number extends K ? never : K]: T[K]
}

/**
 * `keyof (A | B)` is the keys A and B share; distributing first unions them
 * instead, which is what "every field any problem documents" means here.
 */
type KeysOf<T> = T extends unknown ? keyof DeclaredKeysOf<T> : never

type DocumentedProblemField = Extract<KeysOf<DocumentedProblemBody>, string>

type ModelledProblemField = Extract<keyof ProblemDetails, string>

/** Documented by the spec, missing from `ProblemDetails`. */
type UnmodelledField = Exclude<DocumentedProblemField, ModelledProblemField>

/** Modelled on `ProblemDetails`, no longer documented by the spec. */
type UndocumentedField = Exclude<ModelledProblemField, DocumentedProblemField>

/**
 * Fails with "Type '<field>' does not satisfy the constraint 'never'", naming
 * the field that drifted.
 */
type AssertNone<T extends never> = T

export type ProblemContractIsCovered = AssertNone<UnmodelledField>
export type ProblemContractHasNoStaleFields = AssertNone<UndocumentedField>
