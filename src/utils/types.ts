export type ValidationErrors = {
    [key: string]: string[];
};

export type JwtExpiration = `${number}${'s' | 'm' | 'h' | 'd'}` | number;

export interface AuthConfig {
    jwtSecret: string;
    jwtExpiresIn: JwtExpiration;
    refreshTokenExpiresIn: JwtExpiration;
    refreshTokenSecret: string;
    saltRounds: number;
}

export interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
    from: string;
}

export interface Config {
    app: {
        name: string;
        env: string;
        port: number;
        apiUrl: string;
        corsOrigin: string[];
        baseUrl: string;
    };
    auth: AuthConfig;
    email: EmailConfig;
    storage: {
        uploadDir: string;
    };
    db: {
        host: string;
        port: number;
        database: string;
        user: string;
        password: string;
        trustedConnection: boolean;
    };
}
