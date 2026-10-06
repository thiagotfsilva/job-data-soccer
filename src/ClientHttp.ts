import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

type ClientHTTPOptions = {
    baseURL: string;
    token: string;
};

export class ClientHTTP {
    private readonly client: AxiosInstance;

    constructor({ baseURL, token }: ClientHTTPOptions) {
        this.client = axios.create({
            baseURL,
            headers: {
                'X-Auth-Token': token,
            },
        });
    }

    async get<T>(
        path: string,
        config?: AxiosRequestConfig,
    ): Promise<T> {
        const response = await this.client.get<T>(path, config);
        return response.data;
    }

    async post<TResponse, TBody>(
        path: string,
        body: TBody,
        config?: AxiosRequestConfig,
    ): Promise<TResponse> {
        const response = await this.client.post<TResponse>(path, body, config);
        return response.data;
    }
}

const baseURL = process.env.URL_FOOTBALL_DATA;
const token = process.env.API_TOKEN_FOOTBALL_DATA;

if (!baseURL || !token) {
    throw new Error(
        'As variáveis URL_FOOTBALL_DATA e API_TOKEN_FOOTBALL_DATA são obrigatórias.',
    );
}

export default new ClientHTTP({ baseURL, token });