# Pseudotv

<center>
<img src="./docs/assets/pseudotv.png" width="200">
</center>

- [Pseudotv](#pseudotv)
- [Development](#development)
  - [WebUI without API](#webui-without-api)
  - [API without WebUI](#api-without-webui)
  - [API and WebUI on same time](#api-and-webui-on-same-time)


# Development

## WebUI without API
```
npm run serve:web
```

Now access [http://localhost:8080](http://localhost:8080) on port **8080**.

The package and scripts for webui are on `./web/package.json`.

## API without WebUI

```
npm run serve:api
```

Now access [http://localhost:8000/api](http://localhost:8000/api) on port **8000**.

## API and WebUI on same time

Just run `npm start`

Now access [http://localhost:8000](http://localhost:8000) on port **8000**.

The WebUI are on `http://localhost:8000/` and API on `http://localhost:8000/api`. Both on same port.

On develop environment the express make a proxy on `/` path to `http://localhost:8080` were the vue-server is on.
