import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import TextLoader
from langchain_community.embeddings import HuggingFaceEmbeddings

app = Flask(__name__)
CORS(app)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

file_path = "CrakCodeFAQ.txt"  
loader = TextLoader(file_path,encoding="utf-8")
docs = loader.load()

splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
chunks = splitter.split_documents(docs)

embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstore = FAISS.from_documents(chunks, embedding)

chat_history = []

def call_gemini_rag(user_input, context_chunks):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {"Content-Type": "application/json"}

    system_prompt = {
        "role": "user",
        "parts": [{
            "text": (
                "You are an assistant for the CrakCode website, and your goal is to answer user questions "
                "based on the provided context. Use the following context to provide relevant answers.\n\n"
                "Context:\n\n" + context_chunks
            )
        }]
    }

    history_parts = chat_history[-6:]
    current_user_turn = {"role": "user", "parts": [{"text": user_input}]}
    full_conversation = [system_prompt] + history_parts + [current_user_turn]

    data = {"contents": full_conversation}
    response = requests.post(url, headers=headers, json=data)

    if response.status_code == 200:
        try:
            reply = response.json()["candidates"][0]["content"]["parts"][0]["text"]
            chat_history.append(current_user_turn)
            chat_history.append({"role": "model", "parts": [{"text": reply}]})
            return reply
        except:
            return "🤖 Sorry, I couldn't understand the response."
    else:
        return f"❌ Error: {response.status_code} - {response.text}"

def classify_feedback_or_bug(text):
    bug_keywords = ["error", "bug", "issue", "broken", "not working", "glitch", "crash", "fail", "slow"]
    feedback_keywords = ["feedback", "design", "responsive", "theme", "layout", "opinion", "suggestion", "color", "font"]

    text_lower = text.lower()
    for word in bug_keywords:
        if word in text_lower:
            return "bug"
    for word in feedback_keywords:
        if word in text_lower:
            return "feedback"
    return "general"

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_input = data.get("message", "")

    if not user_input:
        return jsonify({"response": "Please provide a message."}), 400

    docs = vectorstore.similarity_search(user_input, k=4)
    context = "\n\n".join([doc.page_content for doc in docs])

    reply = call_gemini_rag(user_input, context)

    category = classify_feedback_or_bug(user_input)
    return jsonify({
        "response": reply,
        "category": category
    })

if __name__ == "__main__":
    app.run(debug=True)
    
