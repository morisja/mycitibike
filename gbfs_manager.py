import functools
import requests
from typing import List, Dict
import json
import time
import os
import boto3

AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")

STATION_INFORMATION_URL = (
    "https://gbfs.citibikenyc.com/gbfs/en/station_information.json"
)
STATION_STATUS_URL = "https://gbfs.citibikenyc.com/gbfs/en/station_status.json"


def get_ttl_hash(seconds=3600):
    """Return the same value withing `seconds` time period"""
    return round(time.time() / seconds)


class GBFSManager:
    def _get(self, url: str):
        x = requests.get(url)
        x.raise_for_status()
        return x.json()

    @functools.lru_cache()
    def get_station_information(self, ttl_hash=None) -> Dict:
        return self._get(STATION_INFORMATION_URL)["data"]["stations"]

    @functools.lru_cache()
    def get_station_status(self, ttl_hash=None) -> Dict[str, dict]:
        return {
            s["station_id"]: s
            for s in self._get(STATION_STATUS_URL)["data"]["stations"]
        }

    def get_all_list_min(self):
        dat = []

        status = self.get_station_status(get_ttl_hash(60))
        for s in self.get_station_information(get_ttl_hash(3600)):
            dat.append(
                {
                    "i": s["station_id"],
                    "n": s["name"],
                    "s": status[s["station_id"]]["station_status"],
                    "b": status[s["station_id"]]["num_bikes_available"],
                    "d": status[s["station_id"]]["num_docks_available"],
                    "lat": s["lat"],
                    "lon": s["lon"],
                }
            )
        return dat

    def get_all_list(self):
        dat = []

        status = self.get_station_status(get_ttl_hash(60))
        for s in self.get_station_information(get_ttl_hash(3600)):
            dat.append(
                {
                    "station_id": s["station_id"],
                    "name": s["name"],
                    "station_status": status[s["station_id"]]["station_status"],
                    "num_bikes_available": status[s["station_id"]][
                        "num_bikes_available"
                    ],
                    "num_docks_available": status[s["station_id"]][
                        "num_docks_available"
                    ],
                    "lat": s["lat"],
                    "lon": s["lon"],
                }
            )
        return dat

    def get_all_dict(self):
        return {s["station_id"]: s for s in self.get_all_list()}


def upload_to_s3(content: str):
    session = boto3.session.Session()
    s3_client = session.client(
        service_name="s3",
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        endpoint_url="https://nyc3.digitaloceanspaces.com",
    )
    s3_client.put_object(
        Body=content, Bucket="mycitibike", Key="stations.json", ACL="public-read"
    )


def main():
    all_stations = sorted(GBFSManager().get_all_list_min(), key=lambda x: x.get("n"))
    upload_to_s3(json.dumps(all_stations))


main()
