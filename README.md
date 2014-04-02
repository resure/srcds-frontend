
Simple web interface for launching selected maps and modes on Source Dedicated Server.

It was developed for internal usage and doesn't provide any kind of access control so it's recommended to place nginx with http basic auth behind this app. Here is example configuration:

```
server {
  server_name example.com;

  location / {
    auth_basic            "Restricted";
    auth_basic_user_file  /home/srcds/httpasswd;

    proxy_pass            http://localhost:3220;
    proxy_http_version    1.1;
    proxy_set_header      Upgrade $http_upgrade;
    proxy_set_header      Connection "upgrade";
  }
}
```

Don't forget to defend internal app port with firewall.
