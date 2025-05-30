import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { plugin as formKitPlugin, defaultConfig } from '@formkit/vue'
import '@formkit/themes/genesis'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(formKitPlugin, defaultConfig)

app.mount('#app')
