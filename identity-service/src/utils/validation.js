const Joi = require("joi");

const validateRegistration = (data) => {
  const schema = Joi.object({
    userName: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string(),
    lastName: Joi.string(),
    profile: Joi.string(),
  });

  //this will validate the data as per this schema
  return schema.validate(data);
};

const validateLogin = (data) => {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });
  return schema.validate(data);
};
module.exports = { validateRegistration, validateLogin };
