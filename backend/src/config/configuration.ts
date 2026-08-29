import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  COGNODB_URI: Joi.string().required(),
  COGNODB_USER: Joi.string().required(),
  COGNODB_PASSWORD: Joi.string().required(),
  PORT: Joi.number().integer().min(1).max(65535).default(3000),
});

export default () => ({
  database: {
    uri: process.env.COGNODB_URI,
    user: process.env.COGNODB_USER,
    password: process.env.COGNODB_PASSWORD,
  },
});