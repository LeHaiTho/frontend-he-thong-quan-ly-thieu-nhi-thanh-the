import React from 'react'
import { App as AntApp, ConfigProvider } from 'antd'
import viVN from 'antd/locale/vi_VN'
import AppRouter from './routes'
import './App.css'

function App() {
  return (
    <ConfigProvider locale={viVN}>
      <AntApp>
        <AppRouter />
      </AntApp>
    </ConfigProvider>
  )
}

export default App
