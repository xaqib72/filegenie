FROM php:8.3-apache

# FileGenie is a PHP front controller with static browser-side engines.
RUN a2enmod rewrite headers expires deflate \
    && sed -ri 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf \
    && sed -ri 's!/var/www/!/var/www/html/public!g' /etc/apache2/apache2.conf \
    && printf '%s\n' '<Directory /var/www/html/public>' '    AllowOverride All' '    Require all granted' '</Directory>' \
       > /etc/apache2/conf-available/filegenie.conf \
    && a2enconf filegenie

WORKDIR /var/www/html
COPY . /var/www/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD php -r '$s=@fsockopen("127.0.0.1",80); exit($s?0:1);'
