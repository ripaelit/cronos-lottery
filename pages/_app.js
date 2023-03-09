import '../styles/globals.css'
import { Provider } from "react-redux"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import store from "../store/store"
import Header from '../components/Common/Header'
import Footer from '../components/Common/Footer'
// import '../styles/fonts/EncodeSans.ttf'

function MyApp({ Component, pageProps }) {
  return <Provider store={store}>
    <div className='page-container' >
      <Header />
      <Component {...pageProps} />
      <Footer />
    </div>
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
    {/* Same as */}
    <ToastContainer />
  </Provider>
}

export default MyApp
