import axios from 'axios'
import Env from '@ioc:Adonis/Core/Env'
import * as https from 'https'

export const apiControlid = axios.create({
  baseURL: Env.get('CONTROLID_API'), headers: { 'Content-Type': `application/json; charset=UTF-8` },
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

apiControlid.interceptors.request.use(async (config) => {
  config.headers['Authorization'] = await getBearerToken()
  return config;
}, function (error) {
  return Promise.reject(error);
});

const getBearerToken = () => {
  return axios.post(`${process.env.CONTROLID_API}/login`, {
    username: Env.get('CONTROLID_API_USER'),
    password: Env.get('CONTROLID_API_PASSWORD')
  }, {
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  })
    .then(res => res.data?.accessToken ? `Bearer ${res.data.accessToken}` : null)
    .catch((err) => {
      console.log('Error get token controlid', err.response)
      throw new Error('Error get token controlid');
    })
}
