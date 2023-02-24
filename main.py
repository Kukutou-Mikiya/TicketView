from flask import Flask, request, jsonify
import flask
import requests

api_key = "94UcyU0cGrWAaWAD6zABpFsfJKNi6znX"

app = Flask(__name__,static_url_path='/static')
app.debug = True

@app.route('/', methods=['GET'])
def home():
   return app.send_static_file('571hw6.html')


@app.route("/events", methods=["GET"])
def events():
    # Get parameters from the URL
    keyword = request.args.get("keyword")
    radius = int(request.args.get("distance"))
    geoPoint = request.args.get("geoPoint")
    category = request.args.get("category")
    

    # Map category to segmentId
    category_to_segmentId = {
        "music": "KZFzniwnSyZfZ7v7nJ",
        "sports": "KZFzniwnSyZfZ7v7nE",
        "arts": "KZFzniwnSyZfZ7v7na",
        "film": "KZFzniwnSyZfZ7v7nn",
        "misc": "KZFzniwnSyZfZ7v7n1",
        "default": ""
    }
    segmentId = category_to_segmentId.get(category, "")

    # Send a GET request to the Ticketmaster Event Search API
    url = "https://app.ticketmaster.com/discovery/v2/events.json?keyword={}&radius={}&unit=miles&geoPoint={}&segmentId={}&apikey={}".format(keyword, radius, geoPoint, segmentId, api_key)
    response = requests.get(url)

    # Return response JSON
    return jsonify(response.json())

@app.route('/event_detail')
def event_detail():
    # Get event ID and API key from JS
    event_id = request.args.get('eventId')

    url = f'https://app.ticketmaster.com/discovery/v2/events/{event_id}.json?apikey={api_key}'

    # Send a GET request to the Ticketmaster Event Detail API
    response = requests.get(url)

    # Return response JSON
    return jsonify(response.json())

@app.route('/venue_detail')
def venue_detail():
    # Get venue name and API key from JS
    venue_name = request.args.get('venueName')

    url = f'https://app.ticketmaster.com/discovery/v2/venues.json?keyword={venue_name}&apikey={api_key}'

    # Send a GET request to the Ticketmaster Venue Search API
    response = requests.get(url)

    # Return response JSON
    return jsonify(response.json())

if __name__ == "__main__":
    app.run(debug=True)
