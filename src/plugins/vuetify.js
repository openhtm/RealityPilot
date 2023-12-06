/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// custom theme
const main = {
  dark: false,
  colors: {
    background: '#F3F2F7', // grey-lighten-4
    primary: '#2979FF', // blue-accent-3
    info: '#424242', // grey-darken-3
    warning: '#FF5722', // deep-orange
    success: '#00C853', // green-accent-4
  }
}

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'main',
    themes: {
      main,
      light: {
        colors: {
          primary: '#1867C0',
          secondary: '#5CBBF6',
        },
      },
    },
  },
})
