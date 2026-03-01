import { AppDataSource } from "./data-source"

AppDataSource.initialize().then(async () => {

}).catch(error => console.log(error))
