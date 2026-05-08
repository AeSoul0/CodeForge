import mongoose from 'mongoose';

// Definiamo lo Schema: è come il modulo che ogni progetto deve compilare per entrare nel database
const projectSchema = new mongoose.Schema({
    titolo: {
        type: String,
        required: true, // Non puoi salvare un progetto senza nome
        trim: true      // Rimuove spazi vuoti inutili ai lati (es: " Progetto " -> "Progetto")
    },
    descrizione: {
        type: String,
        required: true
    },
    tecnologie: {
        type: [String], // Un array di stringhe, es: ["React", "Node"]
        required: true
    },
    linkGithub: {
        type: String,
        required: false // Opzionale: non tutti i progetti sono su GitHub
    },
    linkLive: {
        type: String,
        required: false // Opzionale: il link al sito funzionante
    }
}, {
    // Aggiunge automaticamente i campi "createdAt" (creato il) e "updatedAt" (aggiornato il)
    timestamps: true
});

// Creiamo e esportiamo il Modello 'Project' basato sullo Schema appena fatto
export default mongoose.model('Project', projectSchema);