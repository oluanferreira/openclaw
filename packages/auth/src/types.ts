import type { AuthErrorCode } from "./server";
import type { TranslationKey } from "@workspace/i18n";

const SocialProvider = {
  GOOGLE: "google",
  GITHUB: "github",
} as const;

type SocialProvider = (typeof SocialProvider)[keyof typeof SocialProvider];

const ERROR_MESSAGES = {
  USER_NOT_FOUND: "auth:error.user.notFound",
  FAILED_TO_CREATE_USER: "auth:error.account.creation",
  FAILED_TO_CREATE_SESSION: "auth:error.session.creation",
  FAILED_TO_UPDATE_USER: "auth:error.account.update",
  FAILED_TO_GET_SESSION: "auth:error.session.retrieval",
  INVALID_PASSWORD: "auth:error.credentials.password.invalid",
  INVALID_EMAIL: "auth:error.credentials.email.invalid",
  INVALID_EMAIL_OR_PASSWORD: "auth:error.credentials.invalidEmailOrPassword",
  SOCIAL_ACCOUNT_ALREADY_LINKED: "auth:error.social.alreadyLinked",
  PROVIDER_NOT_FOUND: "auth:error.social.providerNotFound",
  INVALID_TOKEN: "auth:error.token.invalid",
  ID_TOKEN_NOT_SUPPORTED: "auth:error.token.idNotSupported",
  FAILED_TO_GET_USER_INFO: "auth:error.user.infoNotFound",
  USER_EMAIL_NOT_FOUND: "auth:error.user.emailNotFound",
  EMAIL_NOT_VERIFIED: "auth:error.credentials.email.notVerified",
  PASSWORD_TOO_SHORT: "auth:error.credentials.password.tooShort",
  PASSWORD_TOO_LONG: "auth:error.credentials.password.tooLong",
  USER_ALREADY_EXISTS: "auth:error.user.alreadyExists",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "auth:error.user.alreadyExistsUseAnotherEmail",
  EMAIL_CAN_NOT_BE_UPDATED: "auth:error.credentials.email.cannotUpdate",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "auth:error.credentials.notFound",
  SESSION_EXPIRED: "auth:error.session.expired",
  FAILED_TO_UNLINK_LAST_ACCOUNT: "auth:error.social.unlinkLastAccount",
  ACCOUNT_NOT_FOUND: "auth:error.user.accountNotFound",
  USER_ALREADY_HAS_PASSWORD: "auth:error.user.alreadyHasPassword",
  CROSS_SITE_NAVIGATION_LOGIN_BLOCKED:
    "auth:error.crossSiteNavigationLoginBlocked",
  VERIFICATION_EMAIL_NOT_ENABLED: "auth:error.user.verificationEmailNotEnabled",
  EMAIL_ALREADY_VERIFIED: "auth:error.user.emailAlreadyVerified",
  EMAIL_MISMATCH: "auth:error.user.emailMismatch",
  SESSION_NOT_FRESH: "auth:error.session.notFresh",
  LINKED_ACCOUNT_ALREADY_EXISTS:
    "auth:error.account.linkedAccountAlreadyExists",
  INVALID_ORIGIN: "auth:error.invalidOrigin",
  INVALID_CALLBACK_URL: "auth:error.url.invalidCallbackUrl",
  INVALID_REDIRECT_URL: "auth:error.url.invalidRedirectUrl",
  INVALID_ERROR_CALLBACK_URL: "auth:error.url.invalidErrorCallbackUrl",
  INVALID_NEW_USER_CALLBACK_URL: "auth:error.url.invalidNewUserCallbackUrl",
  MISSING_OR_NULL_ORIGIN: "auth:error.missingOrNullOrigin",
  CALLBACK_URL_REQUIRED: "auth:error.url.callbackUrlRequired",
  FAILED_TO_CREATE_VERIFICATION: "auth:error.failedToCreateVerification",
  FIELD_NOT_ALLOWED: "auth:error.fieldNotAllowed",
  ASYNC_VALIDATION_NOT_SUPPORTED: "auth:error.asyncValidationNotSupported",
  VALIDATION_ERROR: "auth:error.validationError",
  MISSING_FIELD: "auth:error.missingField",
  INVALID_USER: "auth:error.user.invalid",
  TOKEN_EXPIRED: "auth:error.token.expired",
  METHOD_NOT_ALLOWED_DEFER_SESSION_REQUIRED:
    "auth:error.methodNotAllowedDeferSessionRequired",
  BODY_MUST_BE_AN_OBJECT: "auth:error.bodyMustBeAnObject",
  PASSWORD_ALREADY_SET: "auth:error.credentials.password.alreadySet",
} as const satisfies Record<AuthErrorCode, TranslationKey>;

export type { AuthErrorCode };

export { SocialProvider, ERROR_MESSAGES };

export type { User, Session } from "./server";
