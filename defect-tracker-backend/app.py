from flask import Flask

# Create a Flask application instance
app = Flask(__name__)

# Define a route for the homepage
@app.route("/")
def home():
    return "Welcome to the Flask App!"

# Run the application
if __name__ == "__main__":
    app.run(debug=True)