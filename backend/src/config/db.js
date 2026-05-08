import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        // Tenta la connessione usando l'URL segreto
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`\n🍃 MongoDB Connesso con successo: ${conn.connection.host}`);
    } catch (error) {
        console.error(`\n❌ Errore di connessione a MongoDB: ${error.message}`);
        // Se c'è un errore, lancia l'eccezione in modo che l'index.js lo intercetti
        throw error;
    }
};