# nginx/Dockerfile
FROM nginx:latest

# Create mandatory dirs
RUN touch /var/run/nginx.pid
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/lib/nginx /etc/nginx/sites-available /etc/nginx/sites-enabled /etc/nginx/ssl

# Copy nginx configs
COPY nginx/* /etc/nginx/
COPY ssl/* /etc/nginx/ssl
COPY sites-available/* /etc/nginx/sites-available

# Own nginx log folders
#RUN chown -R www-data:www-data /var/run/nginx.pid /var/cache/nginx /var/log/nginx /var/lib/nginx /etc/nginx/ssl

# Enable default site
RUN ln -s /etc/nginx/sites-available/default.conf /etc/nginx/sites-enabled/default.conf

# Expose nginx port
EXPOSE 80
EXPOSE 443

# Run nginx
CMD nginx -g "daemon off;"