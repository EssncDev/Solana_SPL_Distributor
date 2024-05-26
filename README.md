# Solana SPL Distributor

# Overview
Solana SPL Distributor is a JavaScript Node.js application designed to periodically distribute vested tokens like Sharky.    
This project aims to check for current token amounts and distributions. Whether you are a developer, a founder, or a hedge manager of tokens, this application provides full functional checks and distribution of token allocations.

## Features
```getDistributionInfo.mjs```:
Fetch the current balance of a token and calculate the amount per share, check or create ATA Accounts.  
```sendDistribution.mjs```: 
Fetch the current balance of a token, calculate the amount per share, check the ATAs, and send out the tokens.

## Getting Started
Prerequisites
Before you begin, ensure you have met the following requirements:

> ```Node.js (version 21.7.1 or higher)```  
> ```npm (version 10.5.0 or higher)```


## Installation
Clone the repository:
```sh
git clone https://github.com/EssncDev/Solana_SPL_Distributor.git
```
Navigate to the project directory:
```sh
cd Solana_SPL_Distributor
```
Install all dependencies:
```sh
npm Install
```
Rebuild project:
```sh
npm rebuild
```

Fill put the distribution.json (share: 0.2 = 20%)
```json
{
    "<token_address>": [
        {
            "pubKey": "<wallet_address>",
            "share": 0.2 
        },
        {
            "pubKey": "<wallet_address>",
            "share": 0.5
        },
        {
            "pubKey": "<wallet_address>",
            "share": 0.3
        }
    ]
}
```
*The Distributor works for multiple tokens. Ensure to add them below in the same JSON style.*

## Usage
Start by filling out the distribution.json in the way its described in installation.

Example
```sh
# Check token and distribution infos based on the Distribution.json
 
node getDistributionInfo.mjs
```
Result:
![Result img](https://github.com/EssncDev/Solana_SPL_Distributor/blob/main/README_components/getDistributionInfo_Result.png?raw=true)

```sh
# Send distribution infos based on the Distribution.json.   
# Insert the token_address to send out in sendDistribution.mjs  
# It only works for one token at a time  
# Then run:

 node sendDistribution.mjs
```
Result:
![Result img](https://github.com/EssncDev/Solana_SPL_Distributor/blob/main/README_components/sendDistribution_Result.png?raw=true)


Example .env file:

```makefile
PK='<wallet_privat_key>' 
ENDPOINT='<quicknode_mainnet_rpc_url>'
```

## Contributing
Contributions are welcome! Please follow these steps:

Fork the repository.
Create a new branch:
```sh
git checkout -b feature-name
```
Make your changes.
Commit your changes:
```sh
git commit -m 'Add some feature'
```
Push to the branch:
```sh
git push origin feature-name
```
Open a pull request.
Please ensure your code follows the project's coding guidelines and includes appropriate tests.

## License
CC BY

## Acknowledgements
EssncDev as the creator  


## Contact
If you have any questions or suggestions, feel free to open an issue or contact me at    
> Discord: ```_rough_```  
>Twitter: ```@ohh_rgh```

Thank you for using this project!