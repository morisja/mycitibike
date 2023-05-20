import functools
import requests
from typing import List, Dict
import json
import time
import os
import xml.etree.ElementTree as ET
import boto3

AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")

STATION_INFORMATION_URL="https://tfl.gov.uk/tfl/syndication/feeds/cycle-hire/livecyclehireupdates.xml"




def get_ttl_hash(seconds=3600):
    """Return the same value withing `seconds` time period"""
    return round(time.time() / seconds)


class GBFSManager:
    def _get(self, url: str):
        x = requests.get(url)
        x.raise_for_status()
        return x.text

    @staticmethod
    def elem_to_dict(elem):
        d={}
        for c in elem:
            d[c.tag]=c.text
        return d

    @functools.lru_cache()
    def get_station_information(self, ttl_hash=None) -> List[dict]:
        out=[]
        tree = ET.fromstring(self._get(STATION_INFORMATION_URL))
        for station in tree:
            out.append(self.elem_to_dict(station))
        return out

    def get_all_list_min(self):
        dat = []

        for s in self.get_station_information(get_ttl_hash(3600)):
            dat.append(
                {
                    "i": s["id"],
                    "n": s["name"],
                    "s": "active",
                    "b": s["nbStandardBikes"],
                    "e": s["nbEBikes"],
                    "d": s["nbEmptyDocks"],
                    "lat": s["lat"],
                    "lon": s["long"],
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
        Body=content, Bucket="mycitibike", Key="santander.json", ACL="public-read"
    )


def main():
    
    all_stations = sorted(GBFSManager().get_all_list_min(), key=lambda x: x.get("n"))
    upload_to_s3(json.dumps(all_stations))


main()
