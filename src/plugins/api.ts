import axios from 'axios'

// Everything below is configured on the instance this module exports. It used
// to be set on the global axios default and the exported instance was created
// separately, so both interceptors were dead code: no request was ever
// de-duplicated and no response ever cleared the pending map.
//
// X-Requested-With matters beyond convention now -- the server treats it as
// the marker that tells its own XHR apart from a cross-site form post.
const api = axios.create({
    baseURL: "./",
    headers: {
        common: { 'X-Requested-With': 'XMLHttpRequest' },
        post: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    },
})

const pendingRequests = new Map()

api.interceptors.request.use(
    (config) => {
        // Generate a unique key for the request
        const requestKey = `${config.method}:${config.url}`
        
        // Check if there is already a pending request with the same key
        if (pendingRequests.has(requestKey)) {
            const cancelSource = pendingRequests.get(requestKey)
            cancelSource.cancel('Duplicate request cancelled')
        }
        
        // Create a new cancel token for the request
        const cancelSource = axios.CancelToken.source()
        config.cancelToken = cancelSource.token
        
        // Store the cancel token in the pending requests map
        pendingRequests.set(requestKey, cancelSource)
        
        if (config.data instanceof FormData) {
            config.headers['Content-Type'] = 'multipart/form-data'
        }
        return config
    },
    (error) => Promise.reject(error),
)

api.interceptors.response.use(
    (response) => {
        // Remove the request from the pending requests map
        const requestKey = `${response.config.method}:${response.config.url}`
        pendingRequests.delete(requestKey)
        return response
    },
    (error) => {
        if (axios.isCancel(error)) {
            // Handle duplicate request cancellation here if needed
            console.warn(error.message)
        } else {
            // Remove the request from the pending requests map on error
            const requestKey = `${error.config.method}:${error.config.url}`
            pendingRequests.delete(requestKey)
        }
        return Promise.reject(error)
    }
)

export default api
