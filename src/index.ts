import { ethers, Wallet} from 'ethers';
import { ETHMixer } from './ETHMixer' 

const inquirer = require("inquirer");

const questions = [
  {
    type: "input",
    name: "receiveEstimation",
    message: "To estimate your occurencies, how ETH you want to mix ? ",
    validate: (value: any) => {
      if (Number.isNaN(value)) return "Please enter valid number";
      return true;
    },
  },
  {
    type: "input",
    name: "occurencies",
    message: "How much occurencies ? :",
    default: 10,
    validate: async (value: any) => {
      if (Number.isNaN(value)) return "Please enter valid number;";
      if(Number(value) > 10)
              return '10 is the maximum value'
      return true;
    },
  },
  
  {
    type: "input",
    name: "destination",
    message: "Destination wallet ? :",
    validate: (value: any) => {
      if (!/^0x[a-fA-F0-9]{40}$/.test(value))
        return "Please enter an valid address";
      return true;
    },
  },
];

const ethMixer = new ETHMixer({
  rpc: "https://data-seed-prebsc-1-s1.binance.org:8545/",
  explorer: "https://testnet.bscscan.com"
});


const validateOccurencies = () => {

  const occurencies = ethMixer.getOption('occurencies')
  
  
  let smallyValue = ethMixer.getOption('receiveEstimation');
  let walletTotals = 0;
  let transactionsTotal = 0;
  for (let i = 0; i < occurencies; i++) {
    smallyValue = smallyValue / 2;
    walletTotals += 2**(i+1);
    
    transactionsTotal += 2**i *2 
    
  }

  console.info(`The money moove in ${walletTotals *2 } wallets`)
  
  inquirer
    .prompt([
      {
        type: "input",
        name: "choice",
        message: `With your options, the minimal division is: ${smallyValue}, do you want to continue ? `,
        options: ["yes", "no"],
        default: "yes",
      },
    ])
    .then(({choice}: any) => {
      if(choice === 'yes' || choice === 'y'){
        ethMixer.waitForStart();
        return;
      }
      inquirer.prompt([
        {
          type: "input",
          name: "occurencies",
          message: "How much occurencies ? :",
          default: 10,
          validate: async (value: any) => {
            if (Number.isNaN(value)) return "Please enter valid number;";
            if(Number(value) > 10)
              return '10 is the maximum value'

            return true;
          },
        },
      ]).then(({occurencies}: any) => {
        ethMixer.updateOptions({
          occurencies
        })
        validateOccurencies();
      })
      
    });
}

inquirer
  .prompt(questions)
  .then(({ occurencies, destination, receiveEstimation }: any) => {
    ethMixer.updateOptions({
      occurencies,
      destination,
      receiveEstimation,
    });

    validateOccurencies()
  
  });
