const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

async function register(email, password) {
  if (!email || !password) {
    const err = new Error('Email and password required');
    err.status = 400;
    throw err;
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hash]
    );

    return result.rows[0];
  } catch (e) {
    if (e.code === '23505') {
      const err = new Error('Email already exists');
      err.status = 400;
      throw err;
    }
    throw e;
  }
}

async function login(email, password) {
  if (!email || !password) {
    const err = new Error('Email and password required');
    err.status = 400;
    throw err;
  }

  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];

  if (!user) {
    const err = new Error('User not found');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid) {
    const err = new Error('Invalid password');
    err.status = 401;
    throw err;
  }

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET);

  return { token };
}

module.exports = {
  register,
  login
};
