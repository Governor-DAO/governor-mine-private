import React, { Component } from "react";
import { ConnectButton } from "./elements/connectButton";
import { HideZeroes } from "./elements/hideZeroes";
import Pool from "./elements/pool";
import { roundValue } from "../../utilities/helpers";
import "./style.scss";

export default class Farm extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hideZeroes: false,
    };
  }

  updateState = () => {
    this.setState({});
  };

  toggleZeroes = () => {
    this.setState((prevState) => ({
      hideZeroes: !prevState.hideZeroes,
    }));
  };

  getTVL = () => {
    let tvl = 0;
    this.props.tokens.forEach((token) => (tvl += token.tvl));
    return tvl;
  };

  render() {
    const tvl = this.getTVL();
    const Pools = () => {
      return this.props.tokens.map((token, index) => {
        if (
          this.state.hideZeroes === true &&
          (token.depositable === null ||
            token.depositable === 0 ||
            token.depositable === "0") &&
          (token.deposited === null ||
            token.deposited === 0 ||
            token.deposited === "0")
        ) {
          return null;
        } else {
          return <Pool key={index} token={token} {...this.props} />;
        }
      });
    };

    return (
      <div className="max-width-container">
        <div className="farm-container">
          <div className="farm-title">
            <div className="title-text">GDAO Mine</div>
            <ConnectButton
              account={this.props.walletconnect?.account}
              setConnection={this.props.walletconnect?.connectWeb3Manual}
            />
          </div>
          <div className="farm-subtitle">
            <span>TVL:</span>
            {`${
              this.props.walletconnect?.isConnected
                ? ` $${roundValue(tvl)}`
                : " -"
            }`}
          </div>
          <div className="farm-subtitle">
            <span>Circulating Supply:</span>
            {` ${this.props.circulatingSupply}`}
          </div>
          <div className="farm-subtitle">
            <a
              href="https://etherscan.io/address/0x4DaC3e07316D2A31baABb252D89663deE8F76f09#code"
              rel="noreferrer"
              target="_blank"
              style={{
                fontSize: "0.8em",
                color: "#ffffff",
                display: "inline-block",
                textAlign: "center",
              }}
            >
              Mine Contract
            </a>
          </div>
          <HideZeroes
            hideZeroes={this.state.hideZeroes}
            toggleZeroes={this.toggleZeroes}
          />
          <Pools />
        </div>
        <div className="gdao-texture-bg" />
        <div className="gdao-phoenix-bg" />
      </div>
    );
  }
}
