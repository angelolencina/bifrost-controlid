import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import { UpdateUserDto } from './dtos/user-update.dto';
import * as https from 'https'
export const apiBioStar = axios.create({
  baseURL: Env.get('BIOSTAR_API'), headers: { 'Content-Type': `application/json; charset=UTF-8` },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

apiBioStar.interceptors.request.use(async (config) => {
  config.headers['bs-session-id'] = await login()
  return config;
}, function (error) {
  return Promise.reject(error);
});

export const login = () => {
  const User = {
    login_id: Env.get("BIOSTAR_USER"),
    password: Env.get("BIOSTAR_PASSWORD")
  }
  return axios.post(`${Env.get('BIOSTAR_API')}/login`, { User }, {
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  })
    .then(res => {
      return res.headers['bs-session-id']
    }).catch(err => {
      console.log('erro ', err)
    })
}

const getUserId = async (email: string) => {
  const user = await searchUser(email)
  return user.user_id
}

export const searchUser = (email: string) => {
  const body = {
    search_text: email
  }
  return apiBioStar.post(`/v2/users/search`, body).then(res => {
    const data = res.data
    if (data.UserCollection.total > 0) {
      return data.UserCollection.rows[0]
    }
    return null
  })
}

export const updateUserDateLimits = async ({ email, start_date, end_date }) => {
  const userId = await getUserId(email)
  const data = { User: { start_datetime: start_date, expiry_datetime: end_date } }
  return updateUser(userId, data)
}

export const updateUser = (id: number, updateUserDto: UpdateUserDto) => {
  return apiBioStar.put(`/users/${id}`, updateUserDto).then(res => {
    console.log("update", res.data)
    return res.data
  })
    .catch(err => {
      console.log('erro ', err.response)
    })
}
