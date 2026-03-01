import AppDataSource from "./data-source"

AppDataSource.initialize()
    .then(() => {
        console.log('✅ Connected successfully');
        process.exit(0);
    })
    .catch((err) => {
        console.error('❌ Connection failed:', err);
        process.exit(1);
    });