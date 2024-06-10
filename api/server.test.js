// Write your tests here
const request = require('supertest')
const db = require('../data/dbConfig')
const server = require('./server')
//const Users = require('./users/users-model')
const jokes = require('./jokes/jokes-data')
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('./secrets')

//const secret = JWT_SECRET
let app

beforeAll(async ()=>{
  await db.migrate.rollback()
  await db.migrate.latest()
})

beforeEach(async ()=>{
  await db('users').truncate()
})

afterAll(async ()=>{
  await db.destroy()
})

test('sanity', () => {
  expect(true).toBe(true)
})

test('correct env var', ()=>{
  expect(process.env.NODE_ENV).toBe('testing')
})

describe('post register endpoint', ()=>{
  test('returns 201 when user registers', async () => {
    const newUser = { username: 'Babara1', password: '1234' };
    const res = await request(server).post("/api/auth/register").send(newUser);

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('username')
})
test('if missing username or password returns 400 and correct error', async ()=>{
    const passwordOnly = { password: '1234' };
    const usernameOnly = { username: 'Barbara1' };

    const resP = await request(server)
      .post('/api/auth/register')
      .send(passwordOnly);

    const resU = await request(server)
      .post('/api/auth/register')
      .send(usernameOnly);

    expect(resP.status).toBe(400)
    expect(resP.body).toHaveProperty(
      'message',
      'username and password required'
    );

    expect(resU.status).toBe(400);
    expect(resU.body).toHaveProperty(
      'message',
      'username and password required'
    )
})
})

describe('post login endpoint', ()=>{
  const barb = {username:'Barbara1', password:'1234'}
  test('checks if username exists', async() => {
    await request(server).post('/api/auth/register').send(barb)

    const res = await request(server).post("/api/auth/login").send(barb)
    expect(res.status).toBe(200)
  })

  test('check if user info is wrong', async() => {
    const res = await request(server).post('/api/auth/login').send({username:'Barbara2', password:'12345'})
    expect(res.status).toBe(422)
  })
})

describe('jokes endpoint', ()=>{
  test('if no token respond with "token required"', async()=>{
    const res = await request(server).get('/api/jokes')
    expect(res.status).toBe(401)
    expect(res.body.message).toEqual('token required')
  })
  test('responds with jokes if has valid token', async()=>{
  const barb = {username:'Barbara1', password:'1234'}
  await request(server).post("/api/auth/register").send(barb)

  await request(server).post('/api/auth/login').send(barb)

   const token = buildToken(barb)
   console.log('token message', token)

   const jokesRes = await request(server)
     .get('/api/jokes')
     .set('Authorization', `${token}`)
     console.log('Status message', jokesRes.status)

   expect(jokesRes.status).toBe(200);
   expect(Array.isArray(jokesRes.body)).toBe(true)
  })
})

function buildToken(user){
  const payload = {
    subject: user.id,
    username: user.username
  }
  const options = {
    expiresIn: '15m'
  }
  return jwt.sign(payload, JWT_SECRET, options)
}

