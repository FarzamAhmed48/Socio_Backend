import multer, { memoryStorage } from "multer"
const upload=multer({
    storage:multer.memoryStorage()
})

export default upload