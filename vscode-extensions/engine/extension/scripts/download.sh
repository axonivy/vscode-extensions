ENGINE_DOWNLOAD_URL=$1
ENGINE_DIR=./engine;

rm -r $ENGINE_DIR

curl --create-dirs -O --output-dir $ENGINE_DIR/ $ENGINE_DOWNLOAD_URL
unzip $ENGINE_DIR/*.zip -d $ENGINE_DIR/AxonIvyEngine

rm $ENGINE_DIR/*.zip
rm -r $ENGINE_DIR/AxonIvyEngine/system/demo-applications
