/* eslint-disable @typescript-eslint/naming-convention */
import axios from 'axios'
import { DateTime } from 'luxon'
import Logger from '@ioc:Adonis/Core/Logger'
import Env from '@ioc:Adonis/Core/Env'
import { UpdateUserDto } from './dtos/user-update.dto'
import * as https from 'https'
export const apiBioStar = axios.create({
  baseURL: Env.get('BIOSTAR_API'),
  headers: { 'Content-Type': `application/json; charset=UTF-8` },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
})

apiBioStar.interceptors.request.use(
  async (config) => {
    config.headers['bs-session-id'] = await login()
    return config
  },
  function (error) {
    return Promise.reject(error)
  }
)

export const login = () => {
  const user = {
    login_id: Env.get('BIOSTAR_USER'),
    password: Env.get('BIOSTAR_PASSWORD'),
  }
  return axios
    .post(
      `${Env.get('BIOSTAR_API')}/login`,
      { User: user },
      {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      }
    )
    .then((res) => {
      return res.headers['bs-session-id']
    })
    .catch((err) => {
      throw new Error(`erro login ${JSON.stringify(err.response.data)}`)
    })
}

const getUserId = async (email: string) => {
  console.log(`get userId by userEmail: ${email}`)
  const user = await searchUser(email)
  if (user) {
    return user.user_id
  }
  throw new Error('Error user does not exist')
}

export const searchUser = (email: string) => {
  const body = {
    search_text: email,
  }

  return apiBioStar.post(`/v2/users/search`, body).then((res) => {
    const data = res.data
    if (data.UserCollection.total > 0) {
      return data.UserCollection.rows[0]
    }
    return null
  })
}

export const updateUserDateLimits = async ({ email, start_date, end_date }) => {
  const start_datetime = DateTime.fromJSDate(start_date)
    .setZone('UTC+0', { keepLocalTime: true })
    .toISO()
  const expiry_datetime = DateTime.fromJSDate(end_date)
    .setZone('UTC+0', { keepLocalTime: true })
    .toISO()
  const userId = await getUserId(email)
  const data = { User: { start_datetime, expiry_datetime } }
  return updateUser(userId, data)
}

export const updateUser = (id: number, updateUserDto: UpdateUserDto) => {
  Logger.info(`Update UserId:  ${id}`)
  return apiBioStar
    .put(`/users/${id}`, updateUserDto)
    .then((res) => {
      return res.data
    })
    .catch((err) => {
      console.log('erro updateUser ', err.response.data)
    })
}
