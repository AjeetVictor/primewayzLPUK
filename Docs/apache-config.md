# Apache Configuration Guide

To host the Primewayz application on an Apache server, follow these steps:

## 1. Static File Hosting (SPA Support)

The built application is located in the `dist` folder. When serving this folder with Apache, ensure `mod_rewrite` is enabled.

The `.htaccess` file (already in `public/` and copied to `dist/`) handles SPA routing from the web root:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## 2. Reverse Proxy for API

If you are running the Node.js backend on the same server (e.g., on port 3000), you should configure Apache as a reverse proxy for the `/api` routes.

Enable the following modules:
- `mod_proxy`
- `mod_proxy_http`

Add the following to your Apache virtual host configuration:

```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/primewayz/dist

    # Serve static files from dist at web root
    <Directory /var/www/primewayz/dist>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Proxy API requests to the Node.js server
    ProxyPreserveHost On
    ProxyPass /api http://localhost:3000/api
    ProxyPassReverse /api http://localhost:3000/api

    # Error logging
    ErrorLog ${APACHE_LOG_DIR}/primewayz_error.log
    CustomLog ${APACHE_LOG_DIR}/primewayz_access.log combined
</VirtualHost>
```

## 3. Environment Variables

Ensure the `DATABASE_URL` and any other secrets are set in the environment where the Node.js server is running.

## 4. Admin Panel URL

With this setup, admin panel is available at:

- `https://kreatorbox.com/admin`

Landing page stays at:

- `https://kreatorbox.com/`
